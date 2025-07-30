import time

from loguru import logger

from bisheng.settings import settings
from bisheng.utils.exceptions import IgnoreException
from bisheng.worker.main import bisheng_celery
from bisheng.worker.workflow.redis_callback import RedisCallback
from bisheng.workflow.common.workflow import WorkflowStatus
from bisheng.workflow.graph.workflow import Workflow


def _execute_workflow(unique_id: str, workflow_id: str, chat_id: str, user_id: str):
    redis_callback = RedisCallback(unique_id, workflow_id, chat_id, user_id)
    try:
        # update workflow status
        redis_callback.set_workflow_status(WorkflowStatus.RUNNING.value)
        # get workflow data
        workflow_data = redis_callback.get_workflow_data()
        if not workflow_data:
            raise Exception('workflow data not found maybe data is expired')

        # init workflow
        workflow_conf = settings.get_workflow_conf()
        workflow = Workflow(workflow_id, user_id, workflow_data, False,
                            workflow_conf.max_steps,
                            workflow_conf.timeout,
                            redis_callback)
        redis_callback.workflow = workflow
        start_time = time.time()
        status, reason = workflow.run()
        first_input = True
        # run workflow
        while True:
            logger.debug(f'workflow execute status: {workflow.status()}')
            if workflow.status() in [WorkflowStatus.FAILED.value, WorkflowStatus.SUCCESS.value]:
                redis_callback.set_workflow_status(status, reason)
                break
            elif workflow.status() == WorkflowStatus.INPUT.value:
                if first_input:
                    start_time = time.time()
                    first_input = False
                redis_callback.set_workflow_status(status, reason)
                time.sleep(1)
                if time.time() - start_time > workflow.timeout * 60:
                    raise IgnoreException('workflow wait user input timeout')
                if redis_callback.get_workflow_stop():
                    raise IgnoreException('workflow stop by user')
                user_input = redis_callback.get_user_input()
                if not user_input:
                    continue
                redis_callback.set_workflow_status(WorkflowStatus.RUNNING.value)
                status, reason = workflow.run(user_input)
                first_input = True
            else:
                raise Exception(f'unexpected workflow status error: {status}')
    except IgnoreException as e:
        logger.warning(f'execute_workflow ignore error: {e}')
        redis_callback.set_workflow_status(WorkflowStatus.FAILED.value, str(e))
    except Exception as e:
        logger.exception('execute_workflow error')
        redis_callback.set_workflow_status(WorkflowStatus.FAILED.value, str(e)[:100])


@bisheng_celery.task
def execute_workflow(unique_id: str, workflow_id: str, chat_id: str, user_id: str):
    """ 执行workflow """
    with logger.contextualize(trace_id=unique_id):
        _execute_workflow(unique_id, workflow_id, chat_id, user_id)
